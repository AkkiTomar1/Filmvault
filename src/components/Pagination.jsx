import React from 'react'

const Pagination = ({handlePrev,handleNext,pageNo}) => {
   
    
    return (
        <div className='bg-gray-400 mt-8 p-2.5 flex justify-center gap-5'>
            <div onClick={handlePrev} className='hover:cursor-pointer hover:scale-130 duration 300'><i class="fa-solid fa-arrow-left"></i></div>
            <div>{pageNo}</div>
            <div onClick={handleNext} className='hover:cursor-pointer hover:scale-130 duration 300'><i class="fa-solid fa-arrow-right"></i></div>
        </div>
    )
}

export default Pagination