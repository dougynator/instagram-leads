'use client';

import { useEffect, useState, useCallback } from 'react';
import { Client } from '@/lib/types';
import ClientForm from '@/components/clients/ClientForm';
import { useToast } from '@/components/ui/Toast';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { toast } = useToast();

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleCreate = async (data: Partial<Client>) => {
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast('success', 'Client created');
        setShowForm(false);
        fetchClients();
      }
    } catch (err) {
      toast('error', 'Failed to create client');
      console.error(err);
    }
  };

  const handleUpdate = async (data: Partial<Client>) => {
    if (!editingClient) return;
    try {
      const res = await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast('success', 'Client updated');
        setEditingClient(null);
        fetchClients();
      }
    } catch (err) {
      toast('error', 'Failed to update client');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this client?')) return;
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('success', 'Client deleted');
        fetchClients();
      }
    } catch (err) {
      toast('error', 'Failed to delete client');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-sm text-muted mt-1">Manage clients and their default filter settings</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingClient(null); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Client
        </button>
      </div>

      {/* Form */}
      {(showForm || editingClient) && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingClient ? 'Edit Client' : 'New Client'}
          </h2>
          <ClientForm
            client={editingClient}
            onSave={editingClient ? handleUpdate : handleCreate}
            onCancel={() => { setShowForm(false); setEditingClient(null); }}
          />
        </div>
      )}

      {/* Client List */}
      {clients.length > 0 ? (
        <div className="space-y-3">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-card border border-border rounded-xl p-5 flex items-center justify-between hover:shadow-sm transition"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">{client.name}</h3>
                {client.notes && (
                  <p className="text-sm text-muted mt-0.5 truncate">{client.notes}</p>
                )}
                <p className="text-xs text-muted mt-1">
                  Created {new Date(client.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {Object.keys(client.default_filters || {}).length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                      Has default filters
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => { setEditingClient(client); setShowForm(false); }}
                  className="p-2 hover:bg-secondary rounded-lg transition text-muted hover:text-foreground"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(client.id)}
                  className="p-2 hover:bg-danger/10 rounded-lg transition text-muted hover:text-danger"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : !showForm ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-muted/40 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-muted mb-2">No clients yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-primary hover:text-primary-dark"
          >
            Create your first client →
          </button>
        </div>
      ) : null}
    </div>
  );
}
