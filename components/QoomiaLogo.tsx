type QoomiaLogoProps={
  size?:number;
  className?:string;
  priority?:boolean;
  label?:string;
};

export default function QoomiaLogo({size=48,className='',priority=false,label='Qoomia'}:QoomiaLogoProps){
  return <img
    src="/icons/qoomia.svg"
    width={size}
    height={size}
    className={`qoomia-logo ${className}`.trim()}
    alt={label}
    decoding="async"
    fetchPriority={priority?'high':'auto'}
  />;
}
