import AppLayout from "./components/AppLayout";
import Header from "./components/Header";

function App() {
  return (
    <div className="min-h-screen w-full relative">
      <div
        className="absolute inset-0 z-[-10]"
        style={{
          background:
            "radial-gradient(125% 125% at 50% 90%, #fff 40%, #6366f1 100%)",
        }}
      />
      <Header />
      <AppLayout />
    </div>
  );
}

export default App;
