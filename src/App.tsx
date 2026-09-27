import ZoomableCanvas from "./components/Canvas";
import { CommentsProvider } from "./context/CommentsContext";
import { IdentityProvider } from "./context/IdentityContext";

const App = () => {
  return (
    <main>
      <h1 className="hidden">Collaboration Canvas</h1>
      <IdentityProvider>
        <CommentsProvider>
          <ZoomableCanvas />
        </CommentsProvider>
      </IdentityProvider>
    </main>
  );
};

export default App;
