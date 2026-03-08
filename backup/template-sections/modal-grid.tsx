import React from 'react';
import Image from 'next/image';

interface ModalCardProps {
  title: string;
  description: string;
  imageSrc: string;
  altText: string;
}

const modalItems: ModalCardProps[] = [
  {
    title: 'Connection Request',
    description: 'Click on the below buttons to launch a Connection Request example.',
    imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/cd6b25ef-7ef1-4ba0-bd1a-7b7365af46fa-wrraptheme-com/assets/svgs/modal-connection-1.svg',
    altText: 'Connection Request Illustration',
  },
  {
    title: 'Create Event',
    description: 'Click on the below buttons to launch a Create Event example.',
    imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/cd6b25ef-7ef1-4ba0-bd1a-7b7365af46fa-wrraptheme-com/assets/svgs/modal-event-2.svg',
    altText: 'Create Event Illustration',
  },
  {
    title: 'Flight Booking',
    description: 'Click on the below buttons to launch a Flight Booking example.',
    imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/cd6b25ef-7ef1-4ba0-bd1a-7b7365af46fa-wrraptheme-com/assets/svgs/modal-flightbooking-3.svg',
    altText: 'Flight Booking Illustration',
  },
  {
    title: 'Job listing',
    description: 'Click on the below buttons to launch a Search Users example.',
    imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/cd6b25ef-7ef1-4ba0-bd1a-7b7365af46fa-wrraptheme-com/assets/svgs/modal-joblisting-4.svg',
    altText: 'Job Listing Illustration',
  },
  {
    title: 'Order Tracking',
    description: 'Click on the below buttons to launch a Order Tracking example.',
    imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/cd6b25ef-7ef1-4ba0-bd1a-7b7365af46fa-wrraptheme-com/assets/svgs/modal-ordertracking-5.svg',
    altText: 'Order Tracking Illustration',
  },
  {
    title: 'Request a Quote',
    description: 'Click on the below buttons to launch a Request a Quote example.',
    imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/cd6b25ef-7ef1-4ba0-bd1a-7b7365af46fa-wrraptheme-com/assets/svgs/modal-quote-6.svg',
    altText: 'Request a Quote Illustration',
  },
  {
    title: 'Search Users',
    description: 'Click on the below buttons to launch a Search Users example.',
    imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/cd6b25ef-7ef1-4ba0-bd1a-7b7365af46fa-wrraptheme-com/assets/svgs/modal-searchusers-7.svg',
    altText: 'Search Users Illustration',
  },
  {
    title: 'Share & Earn',
    description: 'Click on the below buttons to launch a Share & Earn example.',
    imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/cd6b25ef-7ef1-4ba0-bd1a-7b7365af46fa-wrraptheme-com/assets/svgs/modal-sharelink-8.svg',
    altText: 'Share & Earn Illustration',
  },
];

const ModalCard = ({ title, description, imageSrc, altText }: ModalCardProps) => (
  <div className="bg-white rounded-[12px] border border-[#e5e7eb] p-6 flex flex-col items-center text-center card-shadow h-full">
    <div className="mb-6 flex justify-center items-center h-[200px] w-full">
      <Image
        src={imageSrc}
        alt={altText}
        width={300}
        height={200}
        className="max-h-full max-w-full object-contain"
      />
    </div>
    <div className="flex-grow">
      <h5 className="text-[18px] font-semibold text-[#1f2937] mb-2">{title}</h5>
      <p className="text-[12px] text-[#9ca3af] leading-relaxed mb-4">
        {description}
      </p>
    </div>
    <button className="bg-[#F07000] text-white text-[14px] font-medium py-2 px-4 rounded-[8px] transition-colors hover:bg-[#D06000] mt-auto">
      VIEW IN MODALS
    </button>
  </div>
);

const ModalGrid = () => {
  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {modalItems.map((item, index) => (
          <ModalCard
            key={index}
            title={item.title}
            description={item.description}
            imageSrc={item.imageSrc}
            altText={item.altText}
          />
        ))}

        {/* Example of additional specific items logic if needed (e.g. Upgrade plan / Weather) */}
        <ModalCard
          title="Upgrade your plan"
          description="Click on the below buttons to launch a Upgrade plan example."
          imageSrc="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/cd6b25ef-7ef1-4ba0-bd1a-7b7365af46fa-wrraptheme-com/assets/svgs/modal-plan-9.svg"
          altText="Upgrade Plan Illustration"
        />
        <ModalCard
          title="Weather Report"
          description="Click on the below buttons to launch a Weather Report example."
          imageSrc="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/cd6b25ef-7ef1-4ba0-bd1a-7b7365af46fa-wrraptheme-com/assets/svgs/modal-weather-10.svg"
          altText="Weather Report Illustration"
        />
      </div>
    </div>
  );
};

export default ModalGrid;
