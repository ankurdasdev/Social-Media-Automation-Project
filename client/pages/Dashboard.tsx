import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Settings,
  Table,
  BarChart3,
  ArrowRight,
  Zap,
  TrendingUp,
  Users,
} from "lucide-react";

export default function Dashboard() {
  const recentContacts = [
    {
      name: "Rahul Sharma",
      project: "Web Series - Male Lead",
      date: "2 hours ago",
    },
    {
      name: "Priya Desai",
      project: "Film - Supporting Role",
      date: "5 hours ago",
    },
    {
      name: "Amit Kumar",
      project: "Ad Campaign - Brand Ambassador",
      date: "1 day ago",
    },
  ];

  const stats = [
    {
      label: "Total Contacts",
      value: "247",
      icon: Users,
      color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    },
    {
      label: "This Month",
      value: "42",
      icon: TrendingUp,
      color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    },
    {
      label: "Success Rate",
      value: "83.8%",
      icon: Zap,
      color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 dark:from-primary/10 dark:via-secondary/10 dark:to-accent/10" />
          <div className="relative p-8 md:p-12">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Welcome back!
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Your AI-powered casting automation platform is ready. Start by
                configuring your WhatsApp and Instagram groups, and let the AI
                agent find casting opportunities for you.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/controller">
                  <Button size="lg" className="gap-2">
                    <Settings className="w-5 h-5" />
                    Configure Groups
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/contacts">
                  <Button size="lg" variant="outline">
                    View Contacts
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="text-3xl font-bold text-foreground mt-2">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="group cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all">
            <Link to="/controller">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Settings className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Controller</CardTitle>
                    <CardDescription>Manage group monitoring</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Link>
          </Card>

          <Card className="group cursor-pointer hover:border-secondary/50 hover:shadow-lg transition-all">
            <Link to="/contacts">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                    <Table className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Contacts</CardTitle>
                    <CardDescription>View all casting contacts</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Link>
          </Card>

          <Card className="group cursor-pointer hover:border-accent/50 hover:shadow-lg transition-all">
            <Link to="/analytics">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                    <BarChart3 className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Analytics</CardTitle>
                    <CardDescription>Track reach-out metrics</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Link>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Contacts</CardTitle>
            <CardDescription>Latest casting opportunities added</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentContacts.map((contact, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-foreground">{contact.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {contact.project}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">{contact.date}</p>
                </div>
              ))}
            </div>
            <Link to="/contacts" className="block mt-4">
              <Button variant="outline" className="w-full gap-2">
                View all contacts
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              How CastHub Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Configure Your Groups
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Add WhatsApp and Instagram groups where casting calls are
                    posted
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    AI Agent Scans Groups
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Our AI automatically scans for relevant casting calls in your
                    configured groups
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Auto-Send Outreach
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Automatically draft and send personalized email and WhatsApp
                    messages based on predefined templates
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
