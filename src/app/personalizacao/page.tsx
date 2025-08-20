import PersonalizationEditor from '@/components/personalization/PersonalizationEditor';

export const metadata = {
  title: 'Personalizador de Produtos | ADDS',
  description: 'Crie designs personalizados para seus produtos.',
};

export default function PersonalizationPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Personalizador de Produtos</h1>
      <PersonalizationEditor />
    </div>
  );
} 