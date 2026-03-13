import { LifeBuoy } from 'lucide-react'

export default function SuportePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Suporte</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Canal para ajuda tecnica e operacional da plataforma.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <LifeBuoy className="w-8 h-8 text-accent mx-auto mb-2" />
        <p className="text-sm text-text-primary">Canal de suporte em preparacao</p>
        <p className="text-xs text-text-muted mt-1">
          Esta pagina foi adicionada para evitar rota quebrada no menu.
        </p>
      </div>
    </div>
  )
}
