import React, { useContext, useMemo, useEffect } from 'react';
import './Search.css';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';

const Search = () => {
  const { products, fetchProducts } = useContext(StoreContext);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const q = (params.get('q') || '').trim();
  const qLower = q.toLowerCase();
  const categoryAlias = qLower.length <= 1
    ? (qLower === 'o' ? 'Obat' : qLower === 'p' ? 'Pupuk' : null)
    : null;

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const results = useMemo(() => {
    if (!q) return [];
    const lower = q.toLowerCase();
    const filtered = categoryAlias
      ? (products || []).filter(p => String(p.category).toLowerCase().includes(categoryAlias.toLowerCase()))
      : (products || []).filter(p => (
          (p.name || '').toLowerCase().includes(lower) ||
          (p.category || '').toLowerCase().includes(lower) ||
          (p.description || '').toLowerCase().includes(lower)
        ));
    const sorted = [...filtered].sort((a, b) => {
      const ta = new Date(a.createdAt || a.created_at || 0).getTime();
      const tb = new Date(b.createdAt || b.created_at || 0).getTime();
      if (tb !== ta) return tb - ta;
      return parseInt(b._id) - parseInt(a._id);
    });
    return sorted;
  }, [q, products, categoryAlias]);

  const handleOpenProduct = (id) => navigate(`/product/${id}`);

  return (
    <div className="search-page">
      <h1 className="search-title">Hasil Pencarian</h1>
      <p className="search-subtitle">{categoryAlias ? 'Kategori: ' : 'Query: '}<span className="search-query">{categoryAlias || (q || '(kosong)')}</span></p>
      {q && results.length === 0 && (
        <div className="search-empty">Tidak ada produk yang cocok.</div>
      )}
      <div className="search-grid">
        {results.map(item => (
          <div key={item._id} className="search-card" onClick={() => handleOpenProduct(item._id)}>
            <img src={item.image} alt={item.name} />
            <div className="search-card-body">
              <div className="search-card-name">{item.name}</div>
              <div className="search-card-cat">{item.category}</div>
              <div className="search-card-price">Rp {(item.price * 1000).toLocaleString('id-ID')}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Search;
