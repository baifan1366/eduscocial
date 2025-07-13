'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '../../components/ui/card';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col md:flex-row items-center justify-between gap-8 py-12">
        <div className="flex-1">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Welcome to <span className="text-[#FF7D00]">EduSocial</span>
          </h1>
          <p className="text-xl mb-8 text-gray-300">
            Connect with students, share knowledge, and grow together in our educational social platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/register"
              className="bg-[#FF7D00] px-6 py-3 rounded-md text-white font-medium text-center"
            >
              Get Started
            </Link>
            <Link
              href="/about"
              className="border border-[#FF7D00] px-6 py-3 rounded-md text-white font-medium text-center"
            >
              Learn More
            </Link>
          </div>
        </div>
        <div className="flex-1">
          <div 
            className="rounded-xl p-5 relative aspect-video"
          >
            <Image
              src="/metadata.png"
              alt="EduSocial Platform"
              fill
              className="object-contain"
            />
          </div>
        </div>
      </section>

      <section className="py-12">
        <h2 className="text-3xl font-bold mb-8 text-center">
          Why Choose <span className="text-[#FF7D00]">EduSocial</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon="/globe.svg"
            title="Global Community"
            description="Connect with students and educators from around the world."
          />
          <FeatureCard
            icon="/file.svg"
            title="Resource Sharing"
            description="Share and access educational resources easily."
          />
          <FeatureCard
            icon="/window.svg"
            title="Interactive Learning"
            description="Engage in discussions and collaborative projects."
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <Card>
      <CardContent className="text-center">
        <div className="mb-4 flex justify-center">
          <div 
            className="bg-[#FF7D00] rounded-full w-16 h-16 flex items-center justify-center"
          >
            <Image src={icon} alt={title} width={32} height={32} />
          </div>
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-300">{description}</p>
      </CardContent>
    </Card>
  );
}
