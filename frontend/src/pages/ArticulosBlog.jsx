import React, { useEffect, useState } from 'react';
import supabaseServices from '../services/supabase';
import './ArticulosBlog.css';

const ArticulosBlog = () => {
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarArticulos = async () => {
      try {
        setLoading(true);
        const data = await supabaseServices.articulos.getAll();
        setArticulos(data);
      } catch (err) {
        console.error('Error cargando artículos:', err);
        setError('No se pudieron cargar los artículos');
      } finally {
        setLoading(false);
      }
    };

    cargarArticulos();
  }, []);

  if (loading) return <div className="articulos-blog"><h1>Cargando artículos...</h1></div>;
  if (error) return <div className="articulos-blog"><h1>Error: {error}</h1></div>;

  return (
    <div className="articulos-blog">
      <h1>Artículos y Blog</h1>
      {articulos.length === 0 ? (
        <p>No hay artículos publicados aún.</p>
      ) : (
        <div className="articulos-list">
          {articulos.map((articulo) => (
            <div key={articulo.id_articulo} className="articulo-item">
              <h2>{articulo.titulo}</h2>
              <p className="fecha">{new Date(articulo.fecha_publicacion).toLocaleDateString('es-ES')}</p>
              <p>{articulo.contenido}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArticulosBlog;