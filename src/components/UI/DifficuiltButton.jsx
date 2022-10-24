import React from 'react'
import woodcutter from '../../assets/img/woodcutter.jpg'
import farmer from '../../assets/img/farmer.jpg'
import hunter from '../../assets/img/hunter.jpg'

const arrayOfBackGround = [hunter, woodcutter, farmer]

export default function DifficuiltButton({index,callback,name}) {
  return (
    <button className='difficuilt-button' style={{
        backgroundImage: `url(${arrayOfBackGround[index]})`, backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat'
    }} onClick={callback}>{name}</button>
  )
}

