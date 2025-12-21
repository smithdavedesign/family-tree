import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-blue-600 px-8 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-white" />
                        <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
                    </div>
                    <Link to="/" className="text-blue-100 hover:text-white flex items-center gap-1 text-sm font-medium transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                </div>

                <div className="p-8 space-y-6 text-gray-700">
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using Roots & Branches, you accept and agree to be bound by the terms and provision of this agreement.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">2. Description of Service</h2>
                        <p>
                            Roots & Branches provides a web-based platform for users to create, manage, and visualize family trees. The Service includes features for adding family members, defining relationships, and attaching photos.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">3. User Accounts</h2>
                        <p>
                            To access certain features of the Service, you must sign in using your Google account. You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">4. User Content and Responsibilities</h2>
                        <p>
                            You retain all rights to the data, text, and images you upload to the Service ("User Content"). By uploading User Content, you grant us a license to use, store, and display your User Content solely for the purpose of providing the Service to you.
                        </p>
                        <p className="mt-2">
                            You are responsible for ensuring that you have the right to upload any names, dates, or media to the Service, and that your User Content does not violate any third-party rights.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">5. Google Services Integration</h2>
                        <div className="space-y-3">
                            <p>
                                Our Service integrates with Google Photos and Google Drive. By using these features, you acknowledge and agree to be bound by:
                            </p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>The <a href="https://www.google.com/policies/terms/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Terms of Service</a>.</li>
                                <li>The <a href="https://developers.google.com/photos/library/guides/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Photos API Terms of Service</a>.</li>
                                <li>The <a href="https://developers.google.com/drive/api/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Drive API Terms of Service</a>.</li>
                            </ul>
                            <p className="mt-2 text-sm italic">
                                We explicitly adhere to the Google API Services User Data Policy, ensuring that your data is only used for the functional purposes of our genealogical research application.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">6. Account Termination</h2>
                        <p>
                            We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                        </p>
                        <p className="mt-2 underline font-medium">
                            Upon termination, your right to use the Service will immediately cease, and you may request the deletion of all your hosted family tree data via our contact methods.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">7. Changes to Terms</h2>
                        <p>
                            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any material changes via the application's dashboard.
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

export default TermsOfService;
