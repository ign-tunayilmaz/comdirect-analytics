# Comdirect Community Analytics

A powerful React-based web application for analyzing public community posts from the comdirect platform. This tool helps understand common user requests, demands, and views through comprehensive data collection and analytics.

## Features

### 📊 Dashboard
- **Real-time Metrics**: View total posts, average engagement, likes, and replies
- **Sentiment Analysis**: Visual breakdown of positive, negative, and neutral sentiments
- **Request Types**: Categorization of posts (feature requests, bug reports, questions, feedback, complaints, praise)
- **Top Topics**: Identify the most discussed subjects in the community
- **Key Insights**: AI-generated insights highlighting important trends and issues

### 📥 Data Collector
- **Flexible Collection**: Collect posts with customizable filters
- **Sentiment Filtering**: Filter by positive, negative, or neutral sentiment
- **Request Type Filtering**: Focus on specific types of user posts
- **Data Management**: Export data as JSON, clear collected data
- **Local Storage**: Persistent storage of collected posts

### 📈 Advanced Analytics
- **Trend Analysis**: Track sentiment changes over time
- **Common Issues**: Identify top issues and feature requests with engagement metrics
- **Keyword Analysis**: Most frequently mentioned terms and topics
- **Search & Filter**: Advanced filtering by keywords and topics
- **Detailed Post View**: Inspect individual posts with full context

## Technology Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Date Handling**: date-fns

## Installation

1. **Clone or download the project**
   ```bash
   cd comdirect-analytics
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - The app will automatically open at `http://localhost:3000`
   - If not, navigate manually to the URL shown in terminal

## Usage Guide

### 1. Collect Data
- Navigate to **Data Collector** page
- Configure filters (sentiment, request type, number of posts)
- Click **Collect Posts** to gather community data
- Data is automatically saved to local storage

### 2. View Dashboard
- Go to **Dashboard** page
- Review key metrics and insights
- Analyze sentiment distribution and request types
- Identify top discussion topics

### 3. Deep Dive Analytics
- Visit **Analytics** page
- Use search to find specific topics or keywords
- Filter by topic to focus analysis
- Review trend charts showing sentiment over time
- Identify common issues and feature requests

### 4. Export Data
- From Data Collector page, click **Export Data**
- JSON file downloads with all collected posts
- Use for external analysis or backup

## Data Structure

Each collected post contains:
```javascript
{
  id: "post_1",
  author: "User123",
  topic: "Trading fees",
  content: "Post content here...",
  sentiment: "positive|negative|neutral",
  requestType: "feature_request|bug_report|question|feedback|complaint|praise",
  likes: 45,
  replies: 12,
  date: "2025-10-22T10:00:00.000Z",
  tags: ["trading_fees", "urgent"]
}
```

## Customization

### Adding Real Data Sources

Currently, the app uses mock data for demonstration. To connect real data sources:

1. **Edit** `src/utils/dataCollector.js`
2. **Modify** the `fetchCommunityPosts` function
3. **Replace** mock data generation with actual API calls or web scraping

Example:
```javascript
export const fetchCommunityPosts = async (options = {}) => {
  const response = await axios.get('YOUR_API_ENDPOINT', {
    params: options
  });
  return response.data;
}
```

### Customizing Theme Colors

Edit `tailwind.config.js` to change brand colors:
```javascript
colors: {
  'comdirect': {
    'yellow': '#FFD500',  // Your brand yellow
    'blue': '#003C71',    // Your brand blue
    'dark': '#001E3C',    // Your brand dark
  }
}
```

## Build for Production

```bash
npm run build
```

The optimized build will be in the `dist/` directory, ready for deployment.

## Preview Production Build

```bash
npm run preview
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Important Notes

### Data Privacy
- All data is stored locally in browser localStorage
- No data is sent to external servers in the default configuration
- Ensure compliance with data protection regulations when collecting real user data
- Always respect user privacy and terms of service

### Scraping Considerations
- Check comdirect's Terms of Service before scraping
- Consider using official APIs if available
- Implement rate limiting to avoid server overload
- Only collect public data
- Respect robots.txt guidelines

### Performance
- The app handles thousands of posts efficiently
- For very large datasets (>10,000 posts), consider pagination
- Charts may take longer to render with extensive data

## Future Enhancements

Potential features to add:
- Real-time data streaming
- Advanced NLP for better sentiment analysis
- Export to PDF/Excel formats
- Multi-language support
- User authentication and role management
- Custom dashboard widgets
- Automated reporting
- Email alerts for trending issues
- Integration with customer support systems

## Contributing

This is a demonstration project. Feel free to customize and extend it for your needs.

## License

This project is provided as-is for demonstration purposes.

## Support

For issues or questions about this tool, please refer to the code documentation or modify as needed for your specific use case.

---

**Built with ❤️ for Community Insights**

