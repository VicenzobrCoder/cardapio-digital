import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Plus, Trash2, Lock } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const [form, setForm] = useState(null);
  const [newNeighborhood, setNewNeighborhood] = useState({ neighborhood: '', city: 'São Paulo', fee: '', min_time: 30, max_time: 60 });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const { data: settings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/settings/admin').then(r => r.data),
  });

  useEffect(() => {
    if (settings && !form) {
      setForm({
        restaurant_name: settings.restaurant_name || '',
        whatsapp: settings.whatsapp || '',
        address: settings.address || '',
        pix_key: settings.pix_key || '',
        is_open: settings.is_open !== 0,
        min_order_value: settings.min_order_value || 0,
        delivery_fee_value: settings.delivery_fee_value || 0,
        primary_color: settings.primary_color || '#E63946',
        secondary_color: settings.secondary_color || '#457B9D',
        accent_color: settings.accent_color || '#F1A208',
        opening_hours: typeof settings.opening_hours === 'object'
          ? JSON.stringify(settings.opening_hours, null, 2)
          : settings.opening_hours || '{}',
      });
    }
  }, [settings, form]);

  const saveSettings = useMutation({
    mutationFn: (data) => api.put('/settings', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-settings'] }); toast.success('Configurações salvas!'); },
    onError: () => toast.error('Erro ao salvar configurações'),
  });

  const addNeighborhood = useMutation({
    mutationFn: (data) => api.post('/settings/neighborhoods', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-settings'] }); toast.success('Bairro adicionado!'); setNewNeighborhood({ neighborhood: '', city: 'São Paulo', fee: '', min_time: 30, max_time: 60 }); },
    onError: () => toast.error('Erro ao adicionar bairro'),
  });

  const deleteNeighborhood = useMutation({
    mutationFn: (id) => api.delete(`/settings/neighborhoods/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-settings'] }); toast.success('Bairro removido'); },
  });

  const changePassword = useMutation({
    mutationFn: (data) => api.put('/auth/password', data),
    onSuccess: () => { toast.success('Senha alterada com sucesso!'); setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' }); },
    onError: (err) => toast.error(err.response?.data?.error || 'Erro ao alterar senha'),
  });

  function handleSave() {
    let oh = form.opening_hours;
    try { oh = JSON.parse(oh); } catch {}
    saveSettings.mutate({ ...form, opening_hours: oh, is_open: form.is_open });
  }

  function handlePasswordChange() {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('As senhas não coincidem'); return;
    }
    changePassword.mutate({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
  }

  if (!form) return <div className="p-8 text-center text-gray-400">Carregando...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
        Configurações
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { id: 'general', label: '🏠 Geral' },
          { id: 'delivery', label: '🛵 Entrega' },
          { id: 'appearance', label: '🎨 Aparência' },
          { id: 'security', label: '🔒 Segurança' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Aba: Geral */}
      {activeTab === 'general' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <Section title="Informações do Restaurante">
            <Field label="Nome do restaurante *">
              {/* ⚙️ PERSONALIZAÇÃO: Nome do restaurante */}
              <input type="text" value={form.restaurant_name} onChange={e => setForm(p => ({ ...p, restaurant_name: e.target.value }))} className="input-admin" />
            </Field>
            <Field label="WhatsApp (com código do país) *">
              {/* ⚙️ PERSONALIZAÇÃO: WhatsApp de recebimento de pedidos */}
              <input type="text" value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} className="input-admin" placeholder="5511999999999" />
              <p className="text-xs text-gray-400 mt-1">Formato: 55 + DDD + número (sem espaços ou traços)</p>
            </Field>
            <Field label="Endereço completo">
              <input type="text" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="input-admin" />
            </Field>
            <Field label="Chave PIX">
              <input type="text" value={form.pix_key} onChange={e => setForm(p => ({ ...p, pix_key: e.target.value }))} className="input-admin" placeholder="CPF, CNPJ, e-mail ou chave aleatória" />
            </Field>
            <Field label="Horários de funcionamento (JSON)">
              <textarea
                value={form.opening_hours}
                onChange={e => setForm(p => ({ ...p, opening_hours: e.target.value }))}
                rows={4} className="input-admin font-mono text-xs resize-none"
                placeholder='{"seg-sex": "11h às 22h", "sab-dom": "11h às 23h"}'
              />
            </Field>
          </Section>

          <Section title="Status">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm(p => ({ ...p, is_open: !p.is_open }))}
                className={`w-14 h-7 rounded-full transition-all relative cursor-pointer ${form.is_open ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${form.is_open ? 'left-7' : 'left-0.5'}`} />
              </div>
              <span className="font-medium text-gray-800">
                {form.is_open ? '✅ Restaurante aberto' : '⛔ Restaurante fechado'}
              </span>
            </label>
          </Section>

          <Field label="Valor mínimo do pedido (R$)">
            <input type="number" step="0.01" min="0" value={form.min_order_value} onChange={e => setForm(p => ({ ...p, min_order_value: e.target.value }))} className="input-admin" />
          </Field>

          <button onClick={handleSave} disabled={saveSettings.isPending} className="btn-primary w-full justify-center py-3">
            <Save size={18} /> {saveSettings.isPending ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </motion.div>
      )}

      {/* Aba: Entrega */}
      {activeTab === 'delivery' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <Section title="Bairros Atendidos">
            {settings?.delivery_neighborhoods?.map(n => (
              <div key={n.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{n.neighborhood}</p>
                  <p className="text-gray-400 text-xs">Taxa: R$ {n.fee.toFixed(2)} • {n.min_time}–{n.max_time} min</p>
                </div>
                <button onClick={() => deleteNeighborhood.mutate(n.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {settings?.delivery_neighborhoods?.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">Nenhum bairro cadastrado. Será usada taxa fixa.</p>
            )}
          </Section>

          <Section title="Adicionar Bairro">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bairro *">
                <input type="text" value={newNeighborhood.neighborhood} onChange={e => setNewNeighborhood(p => ({ ...p, neighborhood: e.target.value }))} className="input-admin" placeholder="Ex: Jardins" />
              </Field>
              <Field label="Cidade">
                <input type="text" value={newNeighborhood.city} onChange={e => setNewNeighborhood(p => ({ ...p, city: e.target.value }))} className="input-admin" />
              </Field>
              <Field label="Taxa (R$) *">
                <input type="number" step="0.01" min="0" value={newNeighborhood.fee} onChange={e => setNewNeighborhood(p => ({ ...p, fee: e.target.value }))} className="input-admin" placeholder="0,00" />
              </Field>
              <Field label="Tempo (min)">
                <div className="flex gap-2">
                  <input type="number" min="0" value={newNeighborhood.min_time} onChange={e => setNewNeighborhood(p => ({ ...p, min_time: parseInt(e.target.value) }))} className="input-admin w-full" placeholder="30" />
                  <span className="self-center text-gray-400">–</span>
                  <input type="number" min="0" value={newNeighborhood.max_time} onChange={e => setNewNeighborhood(p => ({ ...p, max_time: parseInt(e.target.value) }))} className="input-admin w-full" placeholder="60" />
                </div>
              </Field>
            </div>
            <button
              onClick={() => addNeighborhood.mutate(newNeighborhood)}
              disabled={!newNeighborhood.neighborhood || !newNeighborhood.fee}
              className="btn-primary mt-3 disabled:opacity-50"
            >
              <Plus size={18} /> Adicionar Bairro
            </button>
          </Section>

          <Section title="Taxa fixa (fallback)">
            <Field label="Taxa fixa de entrega (R$)">
              <input type="number" step="0.01" min="0" value={form.delivery_fee_value} onChange={e => setForm(p => ({ ...p, delivery_fee_value: e.target.value }))} className="input-admin" />
              <p className="text-xs text-gray-400 mt-1">Usada quando não há bairros cadastrados</p>
            </Field>
            <button onClick={handleSave} disabled={saveSettings.isPending} className="btn-primary mt-3">
              <Save size={18} /> Salvar
            </button>
          </Section>
        </motion.div>
      )}

      {/* Aba: Aparência */}
      {activeTab === 'appearance' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* ⚙️ PERSONALIZAÇÃO: Cores do tema para cada cliente */}
          <Section title="Cores do Tema">
            <p className="text-sm text-gray-500 mb-4">
              Altere as cores para personalizar o sistema para cada cliente. As mudanças serão aplicadas ao recarregar a página.
            </p>
            {[
              { key: 'primary_color', label: 'Cor Principal', desc: 'Botões, destaques, abas ativas' },
              { key: 'secondary_color', label: 'Cor Secundária', desc: 'Elementos complementares' },
              { key: 'accent_color', label: 'Cor de Destaque', desc: 'Promoções, badges especiais' },
            ].map(c => (
              <Field key={c.key} label={c.label}>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form[c.key]}
                    onChange={e => setForm(p => ({ ...p, [c.key]: e.target.value }))}
                    className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-1"
                  />
                  <input
                    type="text"
                    value={form[c.key]}
                    onChange={e => setForm(p => ({ ...p, [c.key]: e.target.value }))}
                    className="input-admin flex-1 font-mono"
                    placeholder="#E63946"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{c.desc}</p>
              </Field>
            ))}
          </Section>

          {/* Preview */}
          <Section title="Preview das cores">
            <div className="flex gap-3 flex-wrap">
              <div className="w-20 h-20 rounded-xl" style={{ backgroundColor: form.primary_color }}>
                <p className="text-white text-xs text-center pt-7">Principal</p>
              </div>
              <div className="w-20 h-20 rounded-xl" style={{ backgroundColor: form.secondary_color }}>
                <p className="text-white text-xs text-center pt-7">Secundária</p>
              </div>
              <div className="w-20 h-20 rounded-xl" style={{ backgroundColor: form.accent_color }}>
                <p className="text-white text-xs text-center pt-7">Destaque</p>
              </div>
            </div>
          </Section>

          <button onClick={handleSave} disabled={saveSettings.isPending} className="btn-primary w-full justify-center py-3">
            <Save size={18} /> {saveSettings.isPending ? 'Salvando...' : 'Salvar Cores'}
          </button>
        </motion.div>
      )}

      {/* Aba: Segurança */}
      {activeTab === 'security' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Section title="Alterar Senha">
            <div className="space-y-4">
              <Field label="Senha atual">
                <input type="password" value={passwords.currentPassword} onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} className="input-admin" />
              </Field>
              <Field label="Nova senha">
                <input type="password" value={passwords.newPassword} onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} className="input-admin" />
              </Field>
              <Field label="Confirmar nova senha">
                <input type="password" value={passwords.confirmPassword} onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))} className="input-admin" />
              </Field>
              <button onClick={handlePasswordChange} disabled={changePassword.isPending} className="btn-primary">
                <Lock size={18} /> {changePassword.isPending ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </div>
          </Section>
        </motion.div>
      )}

      <style>{`
        .input-admin {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
        }
        .input-admin:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-3 last:mb-0">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
