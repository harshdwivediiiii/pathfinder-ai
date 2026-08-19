import { handleServerError } from "@/lib/errors/error-handler";
import React, { useEffect, useState } from 'react';

// Mock data fetch function (replace with actual data fetching as necessary)
const fetchData = async () => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(['Section 1', 'Section 2', 'Section 3']), 1000);
    });
};

const Dashboard = () => {
    const [sections, setSections] = useState([]);

    useEffect(() => {
        const loadSections = async () => {
            try {
                const data = await fetchData();
                if (data.length) {
                    setSections(data);
                }
            } catch (error) {
    return handleServerError(error, "dashboardContent");
  }
        };
        loadSections();
    }, []);

    if (!sections.length) {
        return <div>Loading...</div>; // Handle blank page issue with loading indicator
    }

    return (
        <div>
            {sections.map((section, index) => (
                <div key={index} className="dashboard-section">
                    <h2>{section}</h2>
                    <p>Content for {section}</p>
                </div>
            ))}
        </div>
    );
};

export default Dashboard;
