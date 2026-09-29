import main from '../assets/mascot/main_icon.webp';
import wave from '../assets/mascot/wave.webp';
import heart from '../assets/mascot/heart.webp';
import reading from '../assets/mascot/reading.webp';
import lying from '../assets/mascot/lying.webp';
import back from '../assets/mascot/back.webp';

// 상황별 토끼 포즈
const POSES = { main, wave, heart, reading, lying, back };

export default function Mascot({ pose = 'wave', size = 56, className = '' }) {
  return (
    <img
      className={'mascot ' + className}
      src={POSES[pose] || POSES.wave}
      width={size}
      height={size}
      alt=""
      draggable={false}
    />
  );
}
