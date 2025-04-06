import Link from 'next/link';

export default function Home() {
  return (
    <div className="w-auto h-[50vh] rounded-2xl shadow-lg inline-block object-cover"
          />
          <img
            src="/images/carousel/resting-athlete.jpg"
            alt="Resting athlete"
            className="h-[500px] rounded-2xl shadow-lg inline-block object-cover"
          />
          <img
            src="/images/carousel/barbell-curl.jpg"
            alt="Barbell curl"
            className="h-[500px] rounded-2xl shadow-lg inline-block object-cover"
          />
          <img
            src="/images/carousel/rock-climber.jpg"
            alt="Rock climbing"
            className="h-[500px] rounded-2xl shadow-lg inline-block object-cover"
          />
        </div>
      </div>
    </div>
  );
}
