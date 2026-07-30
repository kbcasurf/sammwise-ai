// to use later
// aim of this is to add a simplified percentage done bar
import { useState } from 'react';




const ProgressDiv = () => {

    const [page] = useState(() =>
        typeof window === 'undefined' ? '' : sessionStorage.getItem('currentPage')
    )

    return (
        <>
            <div className ="NavTest">
                <p>this is a test{page} </p>
            </div>
        </>
     );
}
 
export default ProgressDiv;