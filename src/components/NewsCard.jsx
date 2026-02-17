import React from "react";
import { motion } from "framer-motion";
import { ExternalLink, Calendar, Newspaper } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function NewsCard({ article, index }) {
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const sourceBadgeColor = article.source === "Disney Parks Blog" 
    ? "bg-blue-100 text-blue-700 border-blue-200" 
    : "bg-purple-100 text-purple-700 border-purple-200";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <a 
        href={article.link} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block group"
      >
        <Card className="h-full hover:shadow-lg transition-all duration-300 border-slate-200 bg-white group-hover:border-violet-300">
          <CardContent className="p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center flex-shrink-0">
                <Newspaper className="w-5 h-5 text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <Badge variant="outline" className={`${sourceBadgeColor} mb-2 text-xs`}>
                  {article.source}
                </Badge>
                <h3 className="font-semibold text-slate-900 leading-tight group-hover:text-violet-600 transition-colors line-clamp-2">
                  {article.title}
                </h3>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 line-clamp-3 mb-3">
              {article.excerpt}
            </p>
            
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(article.date)}</span>
              </div>
              <div className="flex items-center gap-1 text-violet-600 group-hover:gap-2 transition-all">
                <span className="font-medium">Read more</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </a>
    </motion.div>
  );
}