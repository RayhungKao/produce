import Headers from "./headers";
import Footer from "./footer";

export default function Layout({ children }) {
  return (
    <>
      <Headers />
      <main style={{ paddingTop: "64px" }}>{children}</main>
      <Footer />
    </>
  );
}
