export const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t bg-background/80 backdrop-blur-sm py-8 md:py-0 mt-16">
      <div className="container mx-auto px-4 flex flex-col items-center justify-between gap-6 md:h-24 md:flex-row">
        <div className="flex flex-col items-center md:items-start gap-2">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {currentYear} Vibe Blog. 由 Qoder 构建.
          </p>
          <p className="text-center text-xs text-muted-foreground md:text-left">
            基于 Next.js + Supabase 构建的现代化博客平台
          </p>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">隐私政策</a>
          <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">使用条款</a>
          <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">联系我们</a>
        </div>
      </div>
    </footer>
  )
}
