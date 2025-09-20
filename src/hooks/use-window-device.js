import variables from '@/styles/breakpoints.module.scss';
import useWindowWidth from './use-window-width';
import { useMemo } from 'react';

export default function useWindowDevice() {
  const width = useWindowWidth();

  const isDesktop = useMemo(() => {
    return width > parseInt(variables['width-lg']);
  }, [width]);

  const isMobile = useMemo(() => {
    return width <= parseInt(variables['width-sm']);
  }, [width]);

  const isPad = useMemo(() => {
    return !isDesktop && !isMobile;
  }, [isDesktop, isMobile]);

  const isMd = useMemo(() => {
    return width <= parseInt(variables['width-md']);
  }, [width]);

  return {
    isDesktop,
    isMobile,
    isPad,
    isMd,
  };
}
