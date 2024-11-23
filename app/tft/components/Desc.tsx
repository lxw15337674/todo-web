interface Props {
  text: string;
}
export const Desc = ({ text }: Props) => {
  return (
    <div>
      {text.split('\n').map((line, index) => (
        <div key={index}>{line}</div>
      ))}
    </div>
  );
};
