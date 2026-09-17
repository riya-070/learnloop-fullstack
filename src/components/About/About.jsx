import React from 'react'
import './About.css'
import about_img from '../../assets/about.png'
import play_icon from '../../assets/play-icon.png'

const About = ({setPlayState}) => {
  return (
    <div className='about'>
      <div className="about-left">
<img src={about_img} alt=""  className='about-img'/>
<img src={play_icon} alt="" className='play-icon' onClick={()=>{setPlayState(true)}} />
      </div>
      <div className="about-right">
        <h3>ABOUT OUR PLATFORM</h3>
        <h2>Empowering Students Through Peer-Led Learning</h2>
        <p>Join a transformative academic support network designed by and for university students. Our platform connects high-achieving students with peers seeking guidance, creating a community built on collaboration, academic excellence, and mentorship.</p>
<p>Whether you are looking to boost your GPA, master complex subjects, or simply learn more effectively, our student mentors—top performers from your own university—are here to help. They offer personalized support, study strategies, and a relatable understanding of the coursework you’re facing.</p>
   <p>With a focus on peer-driven tutoring, goal-oriented learning, and a supportive environment, this platform helps bridge academic gaps and fosters confidence across all disciplines. It's not just about grades—it’s about growth, connection, and succeeding together.</p>
      </div>
    </div>
  )
}

export default About
