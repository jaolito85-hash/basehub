import { Upload, Package, GraduationCap, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Central de Upload</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Escolha onde deseja publicar novo conteudo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/produtos/novo"
          className="bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-card-hover hover:border-accent transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center mb-3">
            <Package className="w-5 h-5 text-accent" />
          </div>
          <h2 className="text-sm font-semibold text-text-primary">Novo Produto</h2>
          <p className="text-xs text-text-muted mt-1">
            Cadastre produto, videos e manuais.
          </p>
        </Link>

        <Link
          href="/treinamentos/novo"
          className="bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-card-hover hover:border-accent transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center mb-3">
            <GraduationCap className="w-5 h-5 text-accent" />
          </div>
          <h2 className="text-sm font-semibold text-text-primary">Novo Treinamento</h2>
          <p className="text-xs text-text-muted mt-1">
            Crie modulo e organize aulas de treinamento.
          </p>
        </Link>

        <Link
          href="/knowbase/gravar"
          className="bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-card-hover hover:border-accent transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5 text-accent" />
          </div>
          <h2 className="text-sm font-semibold text-text-primary">Novo KnowBase</h2>
          <p className="text-xs text-text-muted mt-1">
            Registre conhecimento interno por cargo.
          </p>
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 text-xs text-text-muted flex items-center gap-2">
        <Upload className="w-4 h-4 text-accent" />
        Todas as cargas usam o Supabase Storage configurado no projeto.
      </div>
    </div>
  )
}
