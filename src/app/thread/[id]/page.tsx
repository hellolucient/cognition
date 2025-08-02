export default function ThreadPage({ params }: { params: { id: string } }) {
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-2xl font-bold">Thread {params.id}</h1>
      {/* Full conversation, summary, and comments will go here */}
    </main>
  );
}
