import React ,{ useRef} from 'react'
import './Testimonials.css'
import next_icon from '../../assets/next-icon.png'
import back_icon from '../../assets/back-icon.png'
import user_1 from '../../assets/user-1.png'
import user_2 from '../../assets/user-2.png'
import user_3 from '../../assets/user-3.png'
import user_4 from '../../assets/user-4.png'
const Testimonials = () => {
const slider=useRef();
let tx=0;
const slideForward=()=>{
if(tx>-50){
    tx-=25;
}
slider.current.style.transform = `translateX(${tx}%)`;

}
const slideBackward=()=>{
    if(tx<0){
    tx+=25;
}
slider.current.style.transform = `translateX(${tx}%)`;

}
  return (
    <div className='testimonials'>
        <img src={next_icon} alt="" className='next-btn' onClick={slideForward} />
      <img src={back_icon} alt="" className='back-btn' onClick={slideBackward} />
<div className='slider'>
    <ul ref={slider}>
        <li>
            <div className="slide">
                <div className="user_info">
                    <img src={user_1} alt="" />
                    <div>
                      <h3>kajal Singh</h3>
                        <span>Biotech , India</span>
                    </div>
                </div>
                <p>
                   I’ve always enjoyed helping others understand tough topics, but this platform made that passion purposeful. Tutoring boosted my confidence, improved my own understanding, and helped me build leadership skills I’ll carry beyond university. 
                </p>
            </div>
        </li>
        <li>
            <div className="slide">
                <div className="user_info">
                    <img src={user_2} alt="" />
                    <div>
                      <h3>Rohit Mehta</h3>
                        <span> Computer Science , India</span>
                    </div>
                </div>
                <p>What stood out most was how approachable the mentors were. These weren’t just smart students—they genuinely cared. Whether it was a quick concept revision or a full mock interview, they had my back.</p>
            </div>
        </li>
        <li>
            <div className="slide">
                <div className="user_info">
                    <img src={user_3} alt="" />
                    <div>
                      <h3>kamya Arora</h3>
                        <span>Btech(ECE), India</span>
                    </div>
                </div>
               <p>
                Joining this peer tutoring platform was a game-changer for my academic journey. Getting help from top-performing students who actually understood my struggles made all the difference. I went from confused to confident—fast.
               </p>
            </div>
        </li>
        <li>
            <div className="slide">
                <div className="user_info">
                    <img src={user_4} alt="" />
                    <div>
                      <h3>Aarav Aggarwal</h3>
                        <span>Mechanical Engg., India</span>
                    </div>
                </div>
                <p>
                    I joined late in the semester and felt lost. But with the help of my tutor, I caught up within two weeks. They shared notes, voice messages, and even did revision sessions before my exams
                </p>
            </div>
        </li>
    </ul>
    </div>
    </div>

  )
}

export default Testimonials
