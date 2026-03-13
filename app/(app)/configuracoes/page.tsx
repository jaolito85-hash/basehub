import { Settings } from 'lucide-react'

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Configuracoes</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Ajustes gerais da conta e da empresa estarao disponiveis aqui.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <Settings className="w-8 h-8 text-accent mx-auto mb-2" />
        <p className="text-sm text-text-primary">Painel em preparacao</p>
        <p className="text-xs text-text-muted mt-1">
          Esta pagina foi adicionada para evitar rota quebrada no menu.
        </p>
      </div>
    </div>
  )
}
