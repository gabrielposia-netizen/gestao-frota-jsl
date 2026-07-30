import { FileDown, FileSpreadsheet, FileText } from 'lucide-react';
import { downloadUrl } from '../lib/api';
import { PageHeader } from '../components/ui';

export default function ReportsPage() {
  const reports = [
    { title: 'Veículos (Excel)', desc: 'Lista completa da frota', path: '/reports/vehicles.xlsx', icon: FileSpreadsheet },
    { title: 'Abastecimentos (Excel)', desc: 'Histórico de combustível e custos', path: '/reports/fuelings.xlsx', icon: FileSpreadsheet },
    { title: 'Relatório da frota (PDF)', desc: 'Resumo executivo para gestão', path: '/reports/fleet.pdf', icon: FileText },
  ];

  return (
    <div>
      <PageHeader title="Relatórios" subtitle="Exportação em PDF e Excel para a liderança" />
      <div className="grid md:grid-cols-3 gap-4">
        {reports.map((r) => (
          <div key={r.path} className="card p-5 space-y-3">
            <r.icon className="text-[var(--brand)]" />
            <div>
              <div className="font-display font-bold text-lg">{r.title}</div>
              <div className="text-sm text-[var(--muted)]">{r.desc}</div>
            </div>
            <button className="btn btn-primary w-full" onClick={() => downloadUrl(r.path)}>
              <FileDown size={16} /> Baixar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
