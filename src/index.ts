import url from 'url';
import {Request, Response, NextFunction} from 'express';

export interface EnsureRootUrlOptions {
  ignoreHostnames: string[];
  redirectType: 'permanent' | 'temporary';
}

export default function ensureRootUrl(
  rootUrl: string,
  options: EnsureRootUrlOptions = {
    ignoreHostnames: [],
    redirectType: 'temporary',
  },
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const {ignoreHostnames, redirectType} = options;

    // The requested URL
    const requestedURL = url.parse(
      url.format({
        protocol:
          req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http',
        host: req.headers.host,
        pathname: req.url,
        query: req.query,
      }),
    );

    // The expected URL
    const expectedURL = url.parse(
      url.format({
        ...url.parse(rootUrl),
        pathname: req.url,
        query: req.query,
      }),
    );

    if (!expectedURL.href) {
      throw new Error('configuration-error');
    }
    if (!requestedURL.hostname) {
      throw new Error('configuration-error');
    }

    // Skip ignored hostnames
    if (ignoreHostnames.includes(requestedURL.hostname)) {
      return next();
    }

    // Redirect when requestedURL does not match expectedURL
    if (requestedURL.href !== expectedURL.href) {
      return res.redirect(redirectType ? 302 : 301, expectedURL.href);
    }

    next();
  };
}
