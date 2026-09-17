import React, { useState } from 'react';
import './Contact.css';
import msg_icon from '../../assets/msg-icon.png';
import mail_icon from '../../assets/mail-icon.png';
import phone_icon from '../../assets/phone-icon.png';
import location_icon from '../../assets/location-icon.png';
import white_arrow from '../../assets/white-arrow.png';

const Contact = () => {
  const [result, setResult] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setResult("Sending...");

    const formData = new FormData(event.target);
    formData.append("access_key", "ec54cfb2-adc2-4956-a1a7-983a308f1fb0");

    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData
    }).then(res => res.json());

    if (res.success) {
      console.log("Success:", res);
      setResult("Message sent successfully!");
      event.target.reset();
    } else {
      console.log("Error:", res);
      setResult("Something went wrong. Try again.");
    }
  };

  return (
    <div className='contact'>
      <div className="contact-col">
        <h3>Send us a message <img src={msg_icon} alt="Message Icon" /></h3>
        <p>Don’t hesitate to reach out. Whether you need academic support or want to join our team of high-performing tutors, we're just a message away. We're students—just like you—and we're here to help.</p>
        <ul>
          <li><img src={mail_icon} alt="Mail Icon" /> Contact@Learnloop.dev</li>
          <li><img src={phone_icon} alt="Phone Icon" /> +1 123-456-789</li>
          <li><img src={location_icon} alt="Location Icon" /> Thapar Institute of Engineering and Technology, Patiala, Punjab, India</li>
        </ul>
      </div>

      <div className="contact-col">
        <form onSubmit={onSubmit}>
          <label>Your Name</label>
          <input type="text" name='name' placeholder='Enter your name' required />
          
          <label>Phone Number</label>
          <input type="tel" name='phone' placeholder='Enter your mobile number' required />

          <label>Write your message here</label>
          <textarea name="message" rows="6" placeholder='Enter your message' required></textarea>

          <button type='submit' className='btn dark-btn'>
            Submit now <img src={white_arrow} alt="Arrow Icon" />
          </button>

          {/* Show result message */}
          <span>{result}</span>
        </form>
      </div>
    </div>
  );
};

export default Contact;
