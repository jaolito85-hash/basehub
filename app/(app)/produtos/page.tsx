import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product-card'
import { normalizeRole } from '@/lib/auth/roles'
import { Package, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function ProdutosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  const isAdmin = normalizeRole(profile?.role) === 'admin'

  // Buscar produtos com contagem de vídeos e manuais
  const { data: products } = await supabase
    .from('products')
    .select(`
      id, name, description, thumbnail_url, created_at,
      videos(count),
      manuals(count)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Produtos</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {products?.length ?? 0} produto{products?.length !== 1 ? 's' : ''} cadastrado{products?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/produtos/novo"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:opacity-90 text-white text-sm font-semibold transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </Link>
      </div>

      {/* Grid */}
      {products && products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              description={product.description}
              imageUrl={(product as any).thumbnail_url}
              videoCount={(product.videos as any)?.[0]?.count ?? 0}
              manualCount={(product.manuals as any)?.[0]?.count ?? 0}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 text-center shadow-card">
          <Package className="w-12 h-12 text-border mx-auto mb-4" />
          <h3 className="text-base font-semibold text-text-primary mb-1">Nenhum produto cadastrado</h3>
          <p className="text-sm text-text-muted mb-4">Comece adicionando produtos para organizar seus treinamentos</p>
          <Link
            href="/produtos/novo"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:opacity-90 text-white text-sm font-semibold transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Adicionar Produto
          </Link>
        </div>
      )}
    </div>
  )
}
