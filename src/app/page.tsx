import Image from "next/image";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
      {/* Background image and overlay */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/home.png"
          alt="DigiVault Background Image"
          layout="fill"
          objectFit="cover"
          quality={100}
          priority
          className="filter blur-sm"
        />
        <div className="absolute inset-0 bg-black opacity-30"></div>
      </div>

      {/* Foreground content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center text-white p-4">
        <h1 className="text-6xl font-extrabold mb-4 drop-shadow-lg">DigiVault</h1>
        <p className="text-2xl mb-8 drop-shadow-md">모든 거래소, 한눈에 비교하고 스마트하게 투자하세요</p>
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row gap-6 mt-8">
        <a
          href="/login"
          className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:bg-blue-700 transition duration-300"
        >
          로그인 / 회원가입
        </a>
        <a
          href="/wallet"
          className="bg-gray-200 text-gray-800 px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:bg-gray-300 transition duration-300"
        >
          내 지갑 보기
        </a>
      </div>

      <div className="mt-24 w-full max-w-4xl text-center pb-24 relative z-10">
        <h2 className="text-3xl font-bold mb-8 text-gray-800">어떻게 다른가요?</h2>
        <Image
          src="/example.png"
          alt="DigiVault Example Image"
          width={1200}
          height={800}
          objectFit="contain"
          priority
        />
      </div>
    </main>
  );
}
