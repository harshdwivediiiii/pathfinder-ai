"use server";

export async function searchOpenSourceIssues({ languages = [], labels = ["good first issue"], difficulty = "beginner" }) {
  try {
    let query = "is:issue is:open no:assignee";
    
    // Add languages
    if (languages.length > 0) {
      const langQuery = languages.map(l => `language:${l}`).join(" ");
      query += ` ${langQuery}`;
    }

    // Add labels based on difficulty
    let searchLabels = [];
    if (difficulty === "beginner") {
      searchLabels = ["good first issue", "first-timers-only", "beginner"];
    } else if (difficulty === "intermediate") {
      searchLabels = ["help wanted", "enhancement"];
    } else {
      searchLabels = labels;
    }

    if (searchLabels.length > 0) {
      // GitHub Search API only supports searching by one label properly when combined with OR,
      // so we just pick the primary one or search them as text if needed.
      // But we can do: label:"good first issue"
      const labelQuery = searchLabels.map(l => `label:"${l}"`).join(" ");
      query += ` ${labelQuery}`;
    }

    // Sort by recently updated
    const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=10`;

    const response = await fetch(url, {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Pathfinder-AI-App"
      },
      next: { revalidate: 60 } // cache for 60 seconds
    });

    if (!response.ok) {
      if (response.status === 403) {
        return { success: false, error: "GitHub API rate limit exceeded. Please try again later." };
      }
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Map to a cleaner format for the frontend
    const issues = data.items.map(item => ({
      id: item.id,
      title: item.title,
      url: item.html_url,
      repository: item.repository_url.replace("https://api.github.com/repos/", ""),
      labels: item.labels.map(l => ({ name: l.name, color: l.color })),
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      comments: item.comments,
      user: {
        login: item.user.login,
        avatar_url: item.user.avatar_url,
      }
    }));

    return { success: true, data: issues, total: data.total_count };

  } catch (error) {
    console.error("Error fetching GitHub issues:", error);
    return { success: false, error: "Failed to fetch open source issues." };
  }
}
