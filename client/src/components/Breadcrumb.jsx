import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Breadcrumb = ({ user }) => {
  const location = useLocation();

  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(segment => segment);
    const breadcrumbs = [];

    // Add home breadcrumb
    breadcrumbs.push({
      label: 'Home',
      path: `/${user.role}`,
      isActive: false
    });

    // Build breadcrumbs from path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Skip the role segment (first segment)
      if (index === 0) return;

      const isLast = index === pathSegments.length - 1;
      
      // Map segment to readable label
      const label = getSegmentLabel(segment, user.role);
      
      breadcrumbs.push({
        label,
        path: currentPath,
        isActive: isLast
      });
    });

    return breadcrumbs;
  };

  const getSegmentLabel = (segment, role) => {
    const labelMap = {
      student: {
        'exams': 'Available Exams',
        'join': 'Join Exam',
        'exam': 'Take Exam',
        'marks': 'View Marks',
        'analytics': 'Analytics'
      },
      teacher: {
        'create': 'Create Exam',
        'edit': 'Edit Exam',
        'exams': 'Manage Exams',
        'monitor': 'Live Monitor',
        'results': 'Results',
        'grades': 'Grades',
        'analytics': 'Analytics'
      },
      admin: {
        'overview': 'System Overview',
        'monitoring': 'Live Monitoring',
        'controls': 'System Controls',
        'logs': 'System Logs'
      }
    };

    return labelMap[role]?.[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav className="flex items-center space-x-3 text-sm text-slate-400 mb-6">
      {breadcrumbs.map((breadcrumb, index) => (
        <React.Fragment key={breadcrumb.path}>
          {index > 0 && (
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          {breadcrumb.isActive ? (
            <span className="text-white font-semibold">{breadcrumb.label}</span>
          ) : (
            <Link
              to={breadcrumb.path}
              className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors duration-200"
            >
              {breadcrumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
