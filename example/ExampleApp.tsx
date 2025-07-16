import React, {useState} from 'react';
import {SimpleChartEdge} from '../src/components/SimpleChartEdge'; // או הנתיב אליו יצאת את הקומפוננטה שלך

export const ExampleApp: React.FC = () => {
    // אם הקומפוננטה שלך צריכה פרופס של נתונים - תעביר כאן
    // נניח שזה פשוט כרגע קומפוננטה עצמאית ללא פרופס, אחרת תתאים לפי מימוש

    return (
        <div style={{height: '100vh', width: '100vw'}}>
            <SimpleChartEdge/>
        </div>
    );
};