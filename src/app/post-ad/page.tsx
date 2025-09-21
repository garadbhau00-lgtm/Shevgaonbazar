import AdForm from './_components/ad-form';

export default function PostAdPage() {
  return (
    <main className="p-4">
      <div className="mb-4">
          <h1 className="text-2xl font-bold">नवीन जाहिरात टाका</h1>
          <p className="text-muted-foreground">तुमच्या उत्पादनाची माहिती भरा.</p>
      </div>
      <AdForm />
    </main>
  );
}
