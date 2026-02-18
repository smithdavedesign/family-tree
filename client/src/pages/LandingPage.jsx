import React from 'react';
import { Link } from 'react-router-dom';
import { TreePine, Share2, Map, Camera, ShieldCheck, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui';
import DemoTree from '../components/DemoTree';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="border-b border-gray-100 py-4 px-6 sm:px-12 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-50">
                <div className="flex items-center gap-2">
                    <TreePine className="w-8 h-8 text-teal-600" />
                    <span className="text-xl font-bold text-slate-800 tracking-tight">Roots & Branches</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">Log In</Link>
                    <Link to="/register">
                        <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-full px-6">Get Started</Button>
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative py-20 px-6 sm:px-12 overflow-hidden bg-gradient-to-br from-teal-50 via-white to-purple-50">
                <div className="max-w-6xl mx-auto text-center relative z-10">
                    <h1 className="text-5xl sm:text-7xl font-extrabold text-slate-900 leading-tight mb-6">
                        Preserve Your <span className="text-teal-600">Family Legacy</span> <br />
                        for Generations.
                    </h1>
                    <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Roots & Branches is the visual, interactive way to trace your ancestry,
                        collect stories, and map your family's journey across the world.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/register">
                            <Button className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white text-lg py-6 px-10 rounded-full shadow-lg shadow-teal-200 flex items-center gap-2 group">
                                Start Your Tree <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <Link to="/pricing">
                            <Button variant="outline" className="w-full sm:w-auto text-lg py-6 px-10 rounded-full border-slate-200 !text-slate-600 hover:!bg-slate-50">View Pricing</Button>
                        </Link>
                    </div>
                </div>

                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl opacity-50" />
            </header>

            {/* Demo Tree Snapshot Section */}
            <section className="py-12 px-6 sm:px-12 max-w-7xl mx-auto -mt-8 relative z-20">
                <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl shadow-teal-900/10 border border-slate-100">
                    <div className="bg-slate-50 rounded-[2rem] p-4 sm:p-8">
                        <div className="max-w-3xl mx-auto text-center mb-10">
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Visualizing Your History</h2>
                            <p className="text-slate-500">Every node tells a story. Zoom, pan, and explore your family lineage with precision and clarity.</p>
                        </div>
                        <DemoTree />
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 px-6 sm:px-12 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Everything you need to tell your story.</h2>
                    <p className="text-slate-500 max-w-2xl mx-auto">Powerful tools designed to help you organize complex family histories into beautiful, easy-to-understand visualizations.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<Share2 className="w-6 h-6" />}
                        title="Interactive Tree Visualizations"
                        description="Explore your lineage with beautiful dyanmic layouts. Toggle between horizontal, vertical, and focused lineage views."
                    />
                    <FeatureCard
                        icon={<Map className="w-6 h-6" />}
                        title="Geographic Mapping"
                        description="Visualize where your ancestors lived and traveled with integrated heatmap and marker maps."
                    />
                    <FeatureCard
                        icon={<Camera className="w-6 h-6" />}
                        title="Rich Media Gallery"
                        description="Attach photos and documents from Google Drive and Google Photos directly to your family members."
                    />
                    <FeatureCard
                        icon={<Users className="w-6 h-6" />}
                        title="Collaborative Building"
                        description="Invite family members to contribute stories and photos, building a collective legacy together."
                    />
                    <FeatureCard
                        icon={<ShieldCheck className="w-6 h-6" />}
                        title="Privacy First"
                        description="Your data is encrypted and secure. You control exactly who can see and edit your family information."
                    />
                    <FeatureCard
                        icon={<CheckCircle2 className="w-6 h-6" />}
                        title="AI-Powered Research"
                        description="Use AI to help summarize biographies and suggest connections within your tree."
                    />
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6 sm:px-12 bg-slate-900 text-white overflow-hidden relative">
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h2 className="text-3xl sm:text-5xl font-bold mb-6">Ready to explore your roots?</h2>
                    <p className="text-slate-400 text-lg mb-10">Join thousands of people documenting their history with Roots & Branches.</p>
                    <Link to="/register">
                        <Button className="!bg-white !text-slate-900 hover:!bg-slate-100 text-lg py-6 px-12 rounded-full font-bold transition-colors">Create Free Account</Button>
                    </Link>
                </div>
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 sm:px-12 border-t border-gray-100">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <TreePine className="w-6 h-6 text-teal-600" />
                        <span className="font-bold text-slate-800 tracking-tight">Roots & Branches</span>
                    </div>
                    <div className="flex gap-8 text-sm text-slate-500">
                        <Link to="/pricing" className="hover:text-teal-600">Pricing</Link>
                        <Link to="/privacy" className="hover:text-teal-600">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-teal-600">Terms of Service</Link>
                    </div>
                    <div className="text-sm text-slate-400">
                        &copy; {new Date().getFullYear()} Roots & Branches. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }) => (
    <div className="p-8 bg-white border border-slate-100 rounded-2xl hover:border-teal-200 hover:shadow-xl hover:shadow-teal-500/5 transition-all group">
        <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
        <p className="text-slate-500 leading-relaxed">{description}</p>
    </div>
);

export default LandingPage;
