export default function RemixPage({ params }: { params: { id: string } }) {
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-2xl font-bold">Remix Thread {params.id}</h1>
      {/* Remix UI with pre-filled prompt will go here */}
    </main>
  );
}
