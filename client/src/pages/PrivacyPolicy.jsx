import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-teal-600 px-8 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className="w-8 h-8 text-white" />
                        <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
                    </div>
                    <Link to="/" className="text-teal-100 hover:text-white flex items-center gap-1 text-sm font-medium transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                </div>

                <div className="p-8 space-y-6 text-gray-700">
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introduction</h2>
                        <p>
                            Roots & Branches ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our application.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">2. Information We Collect</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-gray-800">a. Account Information (Google OAuth)</h3>
                                <p>
                                    When you register or sign in using Google OAuth, we collect your <strong>email address, name, and profile picture</strong>. This information is used solely to authenticate your identity, create your user profile, and provide a personalized experience.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-800">b. Family Tree Content</h3>
                                <p>
                                    We store the personal history data you provide, including biographical details, relationship links, and life events for individuals in your family tree.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-800">c. Google Drive Integration</h3>
                                <p>
                                    Our "Documents" feature allows you to attach relevant files (such as census records or certificates) from your Google Drive. <strong>We do not scan your entire Drive.</strong> We only access specific files you select via the Google Drive Picker and store the necessary metadata and access tokens to display these files within your tree.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-800">d. Google Photos Data & Limited Use Disclosure</h3>
                                <p>
                                    Roots & Branches allows you to enrich your family history by attaching photos from Google Photos.
                                </p>
                                <ul className="list-disc pl-5 mt-2 space-y-2">
                                    <li><strong>Limited Access:</strong> We only access your Google Photos library when you explicitly open the photo picker.</li>
                                    <li><strong>Data Storage:</strong> We only store the Google Media ID and the URL for the specific images you select to attach to a person's profile.</li>
                                    <li><strong>Google API Disclosure:</strong> Roots & Branches' use and transfer of information received from Google APIs to any other app will adhere to <a href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">Google API Services User Data Policy</a>, including the Limited Use requirements.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">3. How We Use and Share Your Data</h2>
                        <p>Your information is used strictly to provide the core services of Roots & Branches:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-2">
                            <li>To visualize and manage your family tree data.</li>
                            <li>To facilitate collaboration between family members you invite.</li>
                            <li>To securely show files and images you have linked from Google services.</li>
                        </ul>
                        <p className="mt-3">
                            <strong>We do not sell your personal data.</strong> Your information is not shared with third-party advertisers or data brokers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">4. Data Retention and Deletion</h2>
                        <p>
                            You have full control over your data. You can delete individual family tree entries or your entire account at any time. When an account is deleted, all associated personal data and links to third-party services (like Google) are permanently removed from our databases.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">5. Data Security</h2>
                        <p>
                            We use industry-standard encryption and security protocols provided by Supabase and Render to protect your information. Your authentication tokens for Google services are stored encrypted and are only used for the purposes you have authorized.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">6. Contact Us</h2>
                        <p>
                            If you have questions regarding your privacy, please contact us at support@rootsandbranches.app.
                        </p>
                    </section>

                    <div className="pt-6 border-t text-sm text-gray-500">
                        Last updated: December 21, 2025
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
