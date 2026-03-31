const getInitials = (name = "") => {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase())
    .join("");
};

const Initials = ({ name }) => <span>{getInitials(name)}</span>;

export default Initials;