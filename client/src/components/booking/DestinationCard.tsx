import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DestinationCardProps {
  name: string;
  type: string;
  image: string;
  price: string;
  index: number;
}

export function DestinationCard({ name, type, image, price, index }: DestinationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative rounded-3xl overflow-hidden aspect-[4/5] cursor-pointer"
    >
      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500" />
      <img 
        src={image} 
        alt={name} 
        className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
      
      <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-white text-sm font-medium">
        {type}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        <div className="flex items-center gap-1 text-yellow-400 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
          <Star className="w-4 h-4 fill-current" />
          <span className="text-white text-sm font-medium">4.9</span>
        </div>
        
        <h3 className="text-2xl font-display font-bold text-white mb-1">{name}</h3>
        <p className="text-white/80 text-sm mb-4">Desde <span className="text-white font-bold text-lg">{price}</span></p>
        
        <Button 
          variant="secondary" 
          className="w-full rounded-xl bg-white text-foreground hover:bg-white/90 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0"
        >
          Reservar <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
