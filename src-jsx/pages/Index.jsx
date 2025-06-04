import { useAuth } from "@/lib/AuthContext";
import BillGenerator from "@/components/BillGenerator";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-[2000px] mx-auto py-2 px-1">
        <BillGenerator onLogout={handleLogout} />
      </main>
    </div>
  );
};

export default Index;
