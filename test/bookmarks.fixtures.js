function makeBookmarksArray() {
  return [
    {
      id: 1,
      title: 'SQL Tutorial - W3Schools',
      url: 'https://www.w3schools.com/sql/',
      description: 'Our SQL tutorial will teach you how to use SQL in: MySQL, SQL Server, MS Access, Oracle, Sybase, Informix, ... Start learning SQL now! ... Learn by examples!',
      rating: 3
    },
    {
      id: 2,
      title: 'What is SQL? A Beginners Guide to the SQL Programming',
      url: 'https://learntocodewith.me/posts/sql-guide/',
      description: 'When working with databases, a programmer might write commands such as: CREATE DATABASE - to create a database. CREATE TABLE - to create tables. SELECT - to find/extract some data from a database. UPDATE - make adjustments and edit data. DELETE - to delete some data.',
      rating: 4
    },
    {
      id: 3,
      title: 'SQL Tutorial for Beginners: Learn SQL in 7 Days - Guru99',
      url: 'https://www.guru99.com/sql.html',
      description: 'Learn SQL for beginners in just 5 days! Click here to take our free and easy SQL tutorials, right now. No experience required.',
      rating: 2
    }
  ];
}

function makeMaliciousBookmark() {
  const maliciousBookmark = {
    id: 911,
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    url: 'https://www.guru99.com/sql.html',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    rating: 3
  };
  
  const expectedBookmark = {
    ...maliciousBookmark,
    title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
  };
  
  return {
    maliciousBookmark,
    expectedBookmark
  }
}

module.exports = {
  makeBookmarksArray,
  makeMaliciousBookmark
};