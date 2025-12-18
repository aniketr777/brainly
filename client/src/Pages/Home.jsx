import Navbar from "@/components/Navbar";
import Testimonial from "@/components/Testimonial";
import Plan from "@/components/Plan";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import HomeShowcase from "@/components/HomeShowcase";
import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
function Home() {
  const { getToken } = useAuth();
  useEffect(() => {
    const fetchData = async () => {
      const token = await getToken();
      console.log("userToken", token);
    };
    fetchData();
  }, [getToken]);

  return (
    <div className="bg-black">
      <Navbar />
      <Hero />
      <HomeShowcase />
      <Testimonial />
      <Plan />
      <Footer />
    </div>
  );
}

export default Home;
