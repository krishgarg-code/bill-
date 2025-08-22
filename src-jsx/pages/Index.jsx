import BillGenerator from "@/components/BillGenerator";

const Index = ({ onLogout }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-[2000px] mx-auto py-2 px-1">
        <BillGenerator onLogout={onLogout} />
      </main>
    </div>
  );
};

export default Index;
