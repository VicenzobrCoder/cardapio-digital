import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Save, ImagePlus } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function MenuAdmin() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('products');
  const [editProduct, setEditProduct] = useState(null);
  const [editCategory, setEditCategory] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  // Queries
  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => api.get('/categories?includeInactive=1').then(r => r.data),
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => api.get('/products/admin/all').then(r => r.data),
  });

  // Mutations
  const deleteProduct = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Produto removido'); },
  });

  const toggleAvailability = useMutation({
    mutationFn: ({ id, available }) => api.patch(`/products/${id}/availability`, { available }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const deleteCategory = useMutation({
    mutationFn: (id) => api.delete(`/categories/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); toast.success('Categoria removida'); },
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
          Cardápio
        </h1>
        <motion.button
          onClick={() => {
            if (activeTab === 'products') { setEditProduct(null); setShowProductForm(true); }
            else { setEditCategory(null); setShowCategoryForm(true); }
          }}
          whileTap={{ scale: 0.97 }}
          className="btn-primary"
        >
          <Plus size={18} /> {activeTab === 'products' ? 'Novo Produto' : 'Nova Categoria'}
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[{ id: 'products', label: '🍽️ Produtos' }, { id: 'categories', label: '📁 Categorias' }].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lista de produtos */}
      {activeTab === 'products' && (
        <div>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-20 shimmer" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map(cat => {
                const catProducts = products.filter(p => p.category_id === cat.id);
                if (catProducts.length === 0) return null;
                return (
                  <div key={cat.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-700 text-sm">
                        {cat.icon} {cat.name} <span className="text-gray-400 font-normal">({catProducts.length})</span>
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {catProducts.map(product => (
                        <motion.div
                          key={product.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-4 px-5 py-4"
                        >
                          {/* Imagem */}
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-14 h-14 object-cover rounded-xl flex-shrink-0"
                              onError={e => { e.target.style.display = 'none'; }}
                            />
                          )}

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`font-semibold text-sm ${!product.available ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                {product.name}
                              </p>
                              {product.featured === 1 && <span className="badge badge-accent text-xs">⭐ Destaque</span>}
                            </div>
                            <p className="text-gray-500 text-xs truncate">{product.description}</p>
                            <p className="text-primary font-bold text-sm mt-0.5">{formatCurrency(product.price)}</p>
                          </div>

                          {/* Ações */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => toggleAvailability.mutate({ id: product.id, available: !product.available })}
                              className={`p-1.5 rounded-lg transition-colors ${product.available ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                              title={product.available ? 'Desativar' : 'Ativar'}
                            >
                              {product.available ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                            </button>
                            <button
                              onClick={() => { setEditProduct(product); setShowProductForm(true); }}
                              className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Remover "${product.name}"?`)) deleteProduct.mutate(product.id);
                              }}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Lista de categorias */}
      {activeTab === 'categories' && (
        <div className="space-y-3">
          {categories.map(cat => (
            <motion.div
              key={cat.id}
              layout
              className="bg-white rounded-2xl shadow-sm px-5 py-4 flex items-center gap-4"
            >
              <span className="text-2xl">{cat.icon}</span>
              <div className="flex-1">
                <p className={`font-semibold ${!cat.active ? 'text-gray-400' : 'text-gray-800'}`}>{cat.name}</p>
                <p className="text-gray-400 text-xs">{cat.description}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {cat.active ? 'Ativa' : 'Inativa'}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => { setEditCategory(cat); setShowCategoryForm(true); }}
                  className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => { if (confirm(`Remover categoria "${cat.name}" e todos os seus produtos?`)) deleteCategory.mutate(cat.id); }}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal de produto */}
      <AnimatePresence>
        {showProductForm && (
          <ProductFormModal
            product={editProduct}
            categories={categories}
            onClose={() => setShowProductForm(false)}
            onSaved={() => { qc.invalidateQueries({ queryKey: ['admin-products'] }); setShowProductForm(false); }}
          />
        )}
      </AnimatePresence>

      {/* Modal de categoria */}
      <AnimatePresence>
        {showCategoryForm && (
          <CategoryFormModal
            category={editCategory}
            onClose={() => setShowCategoryForm(false)}
            onSaved={() => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); setShowCategoryForm(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductFormModal({ product, categories, onClose, onSaved }) {
  const [form, setForm] = useState({
    category_id: product?.category_id || categories[0]?.id || '',
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    promo_price: product?.promo_price || '',
    image_url: product?.image_url || '',
    featured: product?.featured === 1 || false,
    serves: product?.serves || 1,
    available: product?.available !== 0,
  });
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!form.name || !form.price || !form.category_id) {
      toast.error('Nome, preço e categoria são obrigatórios');
      return;
    }
    setLoading(true);
    try {
      if (product) {
        await api.put(`/products/${product.id}`, form);
      } else {
        await api.post('/products', form);
      }
      toast.success(product ? 'Produto atualizado!' : 'Produto criado!');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalWrapper title={product ? 'Editar Produto' : 'Novo Produto'} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label-form">Categoria *</label>
          <select value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))} className="input-form">
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label-form">Nome do produto *</label>
          <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-form" placeholder="Ex: Picanha na Brasa" />
        </div>
        <div>
          <label className="label-form">Descrição</label>
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="input-form resize-none" placeholder="Descreva o produto..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-form">Preço (R$) *</label>
            <input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className="input-form" placeholder="0,00" />
          </div>
          <div>
            <label className="label-form">Preço Promo (R$)</label>
            <input type="number" step="0.01" min="0" value={form.promo_price} onChange={e => setForm(p => ({ ...p, promo_price: e.target.value }))} className="input-form" placeholder="Opcional" />
          </div>
        </div>
        <div>
          <label className="label-form">URL da imagem</label>
          <input type="url" value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))} className="input-form" placeholder="https://..." />
          {form.image_url && (
            <img src={form.image_url} alt="preview" className="w-24 h-24 object-cover rounded-xl mt-2" onError={e => e.target.style.display = 'none'} />
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-form">Serve (pessoas)</label>
            <input type="number" min="1" value={form.serves} onChange={e => setForm(p => ({ ...p, serves: e.target.value }))} className="input-form" />
          </div>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))} className="w-4 h-4 rounded" />
            <span className="text-sm text-gray-700">⭐ Destaque</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.available} onChange={e => setForm(p => ({ ...p, available: e.target.checked }))} className="w-4 h-4 rounded" />
            <span className="text-sm text-gray-700">✅ Disponível</span>
          </label>
        </div>
        <button onClick={handleSave} disabled={loading} className="btn-primary w-full justify-center py-3">
          <Save size={18} /> {loading ? 'Salvando...' : 'Salvar Produto'}
        </button>
      </div>
    </ModalWrapper>
  );
}

function CategoryFormModal({ category, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: category?.name || '',
    description: category?.description || '',
    icon: category?.icon || '🍽️',
    sort_order: category?.sort_order || 0,
    active: category?.active !== 0,
  });
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!form.name) { toast.error('Nome é obrigatório'); return; }
    setLoading(true);
    try {
      if (category) {
        await api.put(`/categories/${category.id}`, form);
      } else {
        await api.post('/categories', form);
      }
      toast.success(category ? 'Categoria atualizada!' : 'Categoria criada!');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar categoria');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalWrapper title={category ? 'Editar Categoria' : 'Nova Categoria'} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label-form">Nome *</label>
          <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-form" placeholder="Ex: Pratos Principais" />
        </div>
        <div>
          <label className="label-form">Descrição</label>
          <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input-form" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-form">Emoji / Ícone</label>
            <input type="text" value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} className="input-form text-center text-2xl" maxLength={4} />
          </div>
          <div>
            <label className="label-form">Ordem</label>
            <input type="number" min="0" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) }))} className="input-form" />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} className="w-4 h-4 rounded" />
          <span className="text-sm text-gray-700">✅ Categoria ativa</span>
        </label>
        <button onClick={handleSave} disabled={loading} className="btn-primary w-full justify-center py-3">
          <Save size={18} /> {loading ? 'Salvando...' : 'Salvar Categoria'}
        </button>
      </div>
    </ModalWrapper>
  );
}

function ModalWrapper({ title, children, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </motion.div>
    </motion.div>
  );
}
