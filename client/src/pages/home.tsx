import { Link } from "wouter";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { tools } from "@/lib/tools";

export default function Home() {
  return (
    <>
      <Header 
        title="Developer Tools Suite" 
        subtitle="Professional tools for modern developers"
      />
      
      <main className="flex-1 overflow-y-auto p-6">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x">
            DevToolNest
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A comprehensive suite of professional developer tools built for efficiency and productivity. 
            Everything you need in one unified platform.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tools.map((tool, index) => {
            const gradientClasses = [
              'bg-gradient-blue',
              'bg-gradient-purple', 
              'bg-gradient-emerald',
              'bg-gradient-amber',
              'bg-gradient-rose',
              'bg-gradient-indigo',
              'bg-gradient-cyan',
              'bg-gradient-orange',
              'bg-gradient-teal',
              'bg-gradient-purple',
              'bg-gradient-emerald',
              'bg-gradient-amber'
            ];
            
            return (
              <Link key={tool.id} href={tool.route}>
                <Card className="tool-card h-full animate-float" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 ${gradientClasses[index % gradientClasses.length]} rounded-lg flex items-center justify-center shadow-lg animate-pulse-glow`}>
                        <tool.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">{tool.name}</h3>
                    </div>
                    <p className="text-muted-foreground text-sm mb-4">{tool.description}</p>
                    <div className="flex items-center text-xs">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      <Badge variant="secondary" className="text-xs animate-shimmer">
                        {tool.status === 'ready' ? 'Ready to use' : tool.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="stats-card glass-effect animate-float" style={{ animationDelay: '0.2s' }}>
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-2">
              10
            </div>
            <div className="text-muted-foreground">Professional Tools</div>
          </div>
          <div className="stats-card glass-effect animate-float" style={{ animationDelay: '0.4s' }}>
            <div className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent mb-2">
              100%
            </div>
            <div className="text-muted-foreground">Client-Side Processing</div>
          </div>
          <div className="stats-card glass-effect animate-float" style={{ animationDelay: '0.6s' }}>
            <div className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
              ∞
            </div>
            <div className="text-muted-foreground">Usage Limit</div>
          </div>
        </div>
      </main>
    </>
  );
}
