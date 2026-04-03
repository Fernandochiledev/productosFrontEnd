import { useState, useEffect } from 'react'
import './index.css'

const API_URL = 'https://7vxw9hjiqg.execute-api.us-east-1.amazonaws.com/prod/productos';

function App() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    stock: '',
    valorCosto: '',
    valorVenta: ''
  });

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al cargar la lista');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      alert('Error de conexión obteniendo los productos: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenModal = (product = null) => {
    if (product) {
      setFormData(product);
      setEditingId(product.id);
    } else {
      setFormData({ nombre: '', descripcion: '', stock: '', valorCosto: '', valorVenta: '' });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let tempProducts = [...products];

      if (editingId) {
        const payload = {
            nombre: formData.nombre,
            descripcion: formData.descripcion,
            stock: Number(formData.stock),
            valorCosto: Number(formData.valorCosto),
            valorVenta: Number(formData.valorVenta)
        };
        const res = await fetch(`${API_URL}/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Falló la edición en servidor');
        
        tempProducts = tempProducts.map(p => (p.id === editingId ? { ...formData, ...payload, id: editingId } : p));
      } else {
        const id = Date.now().toString(); 
        const payload = { 
            id, 
            nombre: formData.nombre,
            descripcion: formData.descripcion,
            stock: Number(formData.stock),
            valorCosto: Number(formData.valorCosto),
            valorVenta: Number(formData.valorVenta) 
        };
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Falló la creación en servidor');
        
        tempProducts.push(payload);
      }
      setProducts(tempProducts);
      handleCloseModal();
    } catch (error) {
      alert('Error guardando el producto: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este producto?')) {
      try {
        const res = await fetch(`${API_URL}/${id}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error('Falló la eliminación');
        
        setProducts(products.filter(p => p.id !== id));
      } catch (error) {
        alert('Error eliminando producto: ' + error.message);
      }
    }
  };

  return (
    <div className="glass-panel">
      <div className="header-actions">
        <div>
          <h1 className="title" style={{ marginBottom: '0.5rem', textAlign: 'left' }}>Inventario</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestión de productos y existencias</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Crear Producto
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Stock</th>
              <th>Valor Costo</th>
              <th>Valor Venta</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" className="empty-state">Cargando datos desde AWS...</td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">No hay productos registrados.</td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  <td style={{ fontWeight: '500' }}>{product.nombre}</td>
                  <td>{product.descripcion}</td>
                  <td>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '999px',
                      background: product.stock < 10 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: product.stock < 10 ? 'var(--danger)' : 'var(--success)',
                      fontSize: '0.85rem'
                    }}>
                      {product.stock}
                    </span>
                  </td>
                  <td>${Number(product.valorCosto).toLocaleString()}</td>
                  <td>${Number(product.valorVenta).toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" onClick={() => handleOpenModal(product)}>Editar</button>
                      <button className="btn btn-danger" onClick={() => handleDelete(product.id)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h2>{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre</label>
                <input required type="text" name="nombre" className="form-control" value={formData.nombre} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <input required type="text" name="descripcion" className="form-control" value={formData.descripcion} onChange={handleInputChange} />
              </div>
              <div className="flex gap-2">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Stock</label>
                  <input required min="0" type="number" name="stock" className="form-control" value={formData.stock} onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Valor Costo</label>
                  <input required min="0" type="number" step="0.01" name="valorCosto" className="form-control" value={formData.valorCosto} onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Valor Venta</label>
                  <input required min="0" type="number" step="0.01" name="valorVenta" className="form-control" value={formData.valorVenta} onChange={handleInputChange} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="btn btn-success">{editingId ? 'Guardar Cambios' : 'Crear Producto'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
