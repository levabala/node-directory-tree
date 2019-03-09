tree = {
  path: "./test/test_data",
  name: "test_data",
  type: "directory",
  children: [
    {
      path: "test/test_data/file_a.txt",
      name: "file_a.txt",
      size: 12,
      type: "file",
      extension: ".txt"
    },
    {
      path: "test/test_data/file_b.txt",
      name: "file_b.txt",
      size: 3756,
      type: "file",
      extension: ".txt"
    },
    {
      path: "test/test_data/some_dir",
      name: "some_dir",
      type: "directory",
      children: [],
      size: 0
    },
    {
      path: "test/test_data/some_dir_2",
      name: "some_dir_2",
      type: "directory",
      children: [],
      size: 0
    }
  ],
  size: 3768
};

module.exports = tree;
